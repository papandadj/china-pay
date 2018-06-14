//微信支付API
const xml2js = require('xml2js');
const request = require('request');
const crypto = require('crypto');
const fs = require('fs');

class wxpayService {

    constructor() {
    }

    /**
     * 统一下单接口 ：APP支付 attach不能为空值 否则微信提示签名错误
     * @param {Object} obj 统一下单需要的全部参数
     * @return {Promise} prepay_id
     */
    async order(obj) {
        return new Promise(async (resolve, reject) => {
            obj.spbill_create_ip = '192.168.0.1';
            obj.trade_type = 'APP';
            obj.nonce_str = await this.createNonceStr();
            obj.appid = this.wxpayJson.appid;
            obj.mch_id = this.wxpayJson.mch_id;
            obj.notify_url = this.wxpayJson.notify_url;
            obj.sign = await this.keyDigest(obj, this.key.key);
            let formData = await this.obj2xml(obj);
            try {
                let { response, body } = await this.fetchXml({ url: "https://api.mch.weixin.qq.com/pay/unifiedorder", method: 'POST', body: formData });
                if (response.statusCode == 200) {
                    let bodyObj = await this.xml2obj(body.toString("utf-8"));
                    if (bodyObj.prepay_id) {
                        resolve(bodyObj.prepay_id)
                    } else {
                        reject(bodyObj)
                    }
                }
            } catch (err) {
                reject(err)
            }
        })
    }

    /**
     * prepay_id再次提取摘要 然后app才能发起支付
     * @param {Object} obj 对prepay_id再次签名 必须有prepay_id, partnerid既appid
     * @return {Object} 签名后的对象
     */
    async appResign(prepay_id) {
        let obj = {};
        obj.prepayid = prepay_id;
        obj.appid = this.wxpayJson.appid;
        obj.partnerid = this.wxpayJson.mch_id;
        obj.package = 'Sign=WXPay';
        obj.noncestr = await this.createNonceStr();
        obj.timestamp = await this.createTimeStamp();
        obj.sign = await this.keyDigest(obj, this.key.key);
        return obj;
    }

    /**
     * @desc:微信扫码支付
     * @param: {obj}
     * @return: code_url
     */
    async webOrder(obj) {
        return new Promise(async (resolve, reject) => {
            obj.appid = this.wxpayJson.appid;
            obj.mch_id = this.wxpayJson.mch_id;
            obj.notify_url = this.wxpayJson.notify_url;
            obj.nonce_str = await this.createNonceStr();
            obj.trade_type = "NATIVE";
            obj.sign = await await this.keyDigest(obj, this.key.key);
            let formData = await this.obj2xml(obj);
            try {
                let { response, body } = await this.fetchXml({ url: "https://api.mch.weixin.qq.com/pay/unifiedorder", method: 'POST', body: formData });
                if (response.statusCode == 200) {
                    let bodyObj = await this.xml2obj(body);
                    if (bodyObj.code_url) {
                        resolve(bodyObj.code_url)
                    } else {
                        reject(body)
                    }
                } else {
                    reject(body)
                }
            } catch (err) {
                reject(err);
            }
        })
    }

    /**
     * 微信签名
     * @param {Object} data 微信数据
     * @return {Bool} 
     */
    async verifySign(data) {
        let sign1 = data.sign;
        delete data.sign;
        let string = await this.obj2keyValue(data);
        string = string + '&key=' + this.key.key;
        var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
        if (sign1 == sign.toUpperCase()) {
            return true
        } else {
            return false
        }
    }

    /**
     * 微信提现
     * @param {Object} obj 微信数据
     * @param {String} key 微信key
     * @return {Bool} 
     */
    async transfersBase(obj) {
        return new Promise(async (resolve, reject) => {
            obj.mch_appid = this.wxpayJson.appid;
            obj.mchid = this.wxpayJson.mch_id;
            obj.nonce_str = await this.createNonceStr();
            obj.check_name = "NO_CHECK";
            obj.spbill_create_ip = "192.168.0.1";
            let key = obj.key;
            delete obj.key;
            obj.sign = await this.keyDigest(obj, this.key.key);
            let formData = await this.obj2xml(obj);
            try {
                let { response, body } = await this.fetchXml({
                    url: 'https://api.mch.weixin.qq.com/mmpaymkttransfers/promotion/transfers', method: 'POST', body: formData, 
                    agentOptions: {
                        pfx: fs.readFileSync(this.key.pfxPath), //微信商户平台证书,
                        passphrase: this.wxpayJson.mch_id
                    }
                });
                if (response.statusCode == 200) {
                    let bodyObj = await this.xml2obj(body);
                    if (bodyObj.return_code == "SUCCESS" && bodyObj.result_code == "SUCCESS") {
                        resolve(true)
                    } else {
                        if (bodyObj.err_code_des) {
                            reject(bodyObj.err_code_des)
                        }
                        reject('支付失败')
                    }
                } else {
                    reject('参数出错')
                }
            } catch (err) {
                reject(err);
            }
        })
    }


    /**
* 获取远程数据， 格式为xml类型
* @param {obj} obj
* - url{String}: 地址
* - method{String}: 'get', 'post' ....
* - body{String}: xml
* @return {Promise}
*/
    async fetchXml({ url = '', method = '', body = '', agentOptions = {} }) {
        return new Promise((resolve, reject) => {
            request({
                url: url,
                method: method,
                body: body,
                agentOptions: agentOptions

            }, function (err, response, body) {
                if (!err) {
                    resolve({ response, body })
                } else {
                    reject(err);
                }
            });
        })
    }

    /**
     *xml字符转换成obj
     * @param {string} xmlStr
     * @returns {Promise}
     */
    xml2obj(xmlStr) {
        return new Promise(function (resolve, reject) {
            let parseString = xml2js.parseString;
            parseString(xmlStr, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    var data = result['xml'];
                    var newData = {};
                    Object.keys(data).forEach(function (key, idx) {
                        if (data[key].length > 0)
                            newData[key] = data[key][0];
                    });
                    resolve(newData);
                }
            });
        });
    }

    /**
     * object 转换成 XML 字符串
     *
     * @param {Object} obj
     * @returns {Promise}
     */
    obj2xml(obj) {
        console.log();
        return new Promise(async (resolve, reject) => {
            var builder = new xml2js.Builder({ cdata: true, rootName: 'xml' });
            try {
                var xmlStr = builder.buildObject(obj);
                resolve(xmlStr);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * 使用微信私有的key并将其摘要，将结果转成大写
     * @param {Object} 微信需要的参数 
     * @return {String} 摘要值
     * 
     */
    async keyDigest(obj, key) {
        var string = await this.obj2keyValue(obj);
        string = string + '&key=' + key;
        var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
        return sign.toUpperCase();
    }

    // 随机字符串产生函数
    async createNonceStr() {
        return Math.random().toString(36).substr(2, 15);
    }

    /**
     * 将对象中的键值由ASCII从大到小排序，并且拼接成字符串 k=v&k1=v1
     * @param {Object} args 
     * @return {String} 
     */
    async obj2keyValue(args) {
        var keys = Object.keys(args);
        keys = keys.sort()
        var newArgs = {};
        keys.forEach(function (key) {
            newArgs[key] = args[key];
        });
        var string = '';
        for (var k in newArgs) {
            string += '&' + k + '=' + newArgs[k];
        }
        string = string.substr(1);
        return string;
    }
    // 时间戳产生函数
    async createTimeStamp() {
        return parseInt(new Date().getTime() / 1000) + '';
    }

}

module.exports = wxpayService;