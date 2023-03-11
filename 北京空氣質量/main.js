// http://www.aqistudy.cn/historydata/monthdata.php?city=%E5%8C%97%E4%BA%AC

var CryptoJS = require("crypto-js")
var myFunc = require("./func")

function Base64() {
    _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    this.encode = function(a) {
        var c, d, e, f, g, h, i, b = "", j = 0;
        for (a = _utf8_encode(a); j < a.length; )
            c = a.charCodeAt(j++),
            d = a.charCodeAt(j++),
            e = a.charCodeAt(j++),
            f = c >> 2,
            g = (3 & c) << 4 | d >> 4,
            h = (15 & d) << 2 | e >> 6,
            i = 63 & e,
            isNaN(d) ? h = i = 64 : isNaN(e) && (i = 64),
            b = b + _keyStr.charAt(f) + _keyStr.charAt(g) + _keyStr.charAt(h) + _keyStr.charAt(i);
        return b
    }
    ,
    this.decode = function(a) {
        var c, d, e, f, g, h, i, b = "", j = 0;
        for (a = a.replace(/[^A-Za-z0-9\+\/\=]/g, ""); j < a.length; )
            f = _keyStr.indexOf(a.charAt(j++)),
            g = _keyStr.indexOf(a.charAt(j++)),
            h = _keyStr.indexOf(a.charAt(j++)),
            i = _keyStr.indexOf(a.charAt(j++)),
            c = f << 2 | g >> 4,
            d = (15 & g) << 4 | h >> 2,
            e = (3 & h) << 6 | i,
            b += String.fromCharCode(c),
            64 != h && (b += String.fromCharCode(d)),
            64 != i && (b += String.fromCharCode(e));
        return b = _utf8_decode(b)
    }
    ,
    _utf8_encode = function(a) {
        var b, c, d;
        for (a = a.replace(/\r\n/g, "\n"),
        b = "",
        c = 0; c < a.length; c++)
            d = a.charCodeAt(c),
            128 > d ? b += String.fromCharCode(d) : d > 127 && 2048 > d ? (b += String.fromCharCode(192 | d >> 6),
            b += String.fromCharCode(128 | 63 & d)) : (b += String.fromCharCode(224 | d >> 12),
            b += String.fromCharCode(128 | 63 & d >> 6),
            b += String.fromCharCode(128 | 63 & d));
        return b
    }
    ,
    _utf8_decode = function(a) {
        for (var b = "", c = 0, d = c1 = c2 = 0; c < a.length; )
            d = a.charCodeAt(c),
            128 > d ? (b += String.fromCharCode(d),
            c++) : d > 191 && 224 > d ? (c2 = a.charCodeAt(c + 1),
            b += String.fromCharCode((31 & d) << 6 | 63 & c2),
            c += 2) : (c2 = a.charCodeAt(c + 1),
            c3 = a.charCodeAt(c + 2),
            b += String.fromCharCode((15 & d) << 12 | (63 & c2) << 6 | 63 & c3),
            c += 3);
        return b
    }
}
var BASE64 = {
    encrypt: function(text) {
        var b = new Base64();
        return b.encode(text);
    },
    decrypt: function(text) {
        var b = new Base64();
        return b.decode(text);
    }
};
var DES = {
    encrypt: function(text, key, iv){
       var secretkey = (CryptoJS.MD5(key).toString()).substr(0, 16);
       var secretiv = (CryptoJS.MD5(iv).toString()).substr(24, 8);
       secretkey = CryptoJS.enc.Utf8.parse(secretkey);
       secretiv = CryptoJS.enc.Utf8.parse(secretiv);
       var result = CryptoJS.DES.encrypt(text, secretkey, {
         iv: secretiv,
         mode: CryptoJS.mode.CBC,
         padding: CryptoJS.pad.Pkcs7
       });
       return result.toString();
    },
    decrypt: function(text, key, iv){
       var secretkey = (CryptoJS.MD5(key).toString()).substr(0, 16);
       var secretiv = (CryptoJS.MD5(iv).toString()).substr(24, 8);
       secretkey = CryptoJS.enc.Utf8.parse(secretkey);
       secretiv = CryptoJS.enc.Utf8.parse(secretiv);
       var result = CryptoJS.DES.decrypt(text, secretkey, {
         iv: secretiv,
         mode: CryptoJS.mode.CBC,
         padding: CryptoJS.pad.Pkcs7
       });
       return result.toString(CryptoJS.enc.Utf8);
     }
   };
   
var AES = {
    encrypt: function(text, key, iv) {
    var secretkey = (CryptoJS.MD5(key).toString()).substr(16, 16);
    var secretiv = (CryptoJS.MD5(iv).toString()).substr(0, 16);
    // console.log('real key:', secretkey);
    // console.log('real iv:', secretiv);
    secretkey = CryptoJS.enc.Utf8.parse(secretkey);
    secretiv = CryptoJS.enc.Utf8.parse(secretiv);
    var result = CryptoJS.AES.encrypt(text, secretkey, {
        iv: secretiv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return result.toString();
    },
    decrypt: function(text, key, iv) {
    var secretkey = (CryptoJS.MD5(key).toString()).substr(16, 16);
    var secretiv = (CryptoJS.MD5(iv).toString()).substr(0, 16);
    secretkey = CryptoJS.enc.Utf8.parse(secretkey);
    secretiv = CryptoJS.enc.Utf8.parse(secretiv);
    var result = CryptoJS.AES.decrypt(text, secretkey, {
        iv: secretiv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return result.toString(CryptoJS.enc.Utf8);
    }
};
   
function os1vRI9rHL(obj){
    var newObject = {};
    Object.keys(obj).sort().map(function(key){
        newObject[key] = obj[key];
    });
    return newObject;
}




function getParam(p1, p2,k,key,iv,mode){
    // 因為從python直接傳一個dict入黎會有問題，所以只好傳一個字符串形式的dict
    // 然後再用JSON.parse來解析
    p2 = JSON.parse(p2) 

    var aAAD = k; //'d587df3d01ccaaca6b3dec0706ba606a'

    var codfg = 'WEB';
    var tJJGBBk = new Date().getTime();

    var pwDTRzW = {
      appId: aAAD,
      method: p1,
      timestamp: tJJGBBk,
      clienttype: codfg,
      object: p2, 
      secret: myFunc.hex_md5(aAAD + p1 + tJJGBBk + codfg + JSON.stringify(os1vRI9rHL(p2))).toString()
    };

    pwDTRzW = BASE64.encrypt(JSON.stringify(pwDTRzW));
    
    if(mode=="AES"){
        pwDTRzW = AES.encrypt(pwDTRzW, key, iv);
    }else if(mode=="DES"){
        pwDTRzW = DES.encrypt(pwDTRzW, key, iv);
    }
           
    return pwDTRzW;
};

function dataDecode(data,aes_key,ase_iv,des_key,des_iv) {
    data = BASE64.decrypt(data);
    data = DES.decrypt(data, des_key, des_iv);
    data = AES.decrypt(data, aes_key, ase_iv);
    data = BASE64.decrypt(data);
    return data;
}

function dweklxde(tsdx) {
    var b = new Base64();
    return b.decode(tsdx)
}

module.exports = {
    dweklxde,
    getParam,
    dataDecode
}



